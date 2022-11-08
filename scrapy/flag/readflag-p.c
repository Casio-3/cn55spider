#include <stdio.h>
#include <stdlib.h>

int main(void) {

    FILE *fp = NULL;
    char flag[255];

    if ((fp = fopen("/flag-p", "r")) == 0){
        return -1;
    }

    fgets(flag, 255, (FILE*)fp);

    fclose(fp);
    printf("%s", flag);

    return 0;
}